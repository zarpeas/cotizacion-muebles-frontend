import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';
import { ToastContainer } from '../../../shared/components/toast/toast';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar, Topbar, ToastContainer, ConfirmDialogComponent],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout {}